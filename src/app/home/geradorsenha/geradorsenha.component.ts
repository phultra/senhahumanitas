import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { DadosContador } from '../../interface/dadoscontador';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Database, get, ref } from '@angular/fire/database';
import { AuthService } from '../../service/auth/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-geradorsenha',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,NgxSpinnerModule, FormsModule],
  templateUrl: './geradorsenha.component.html',
  styleUrl: './geradorsenha.component.scss'
})
export class GeradorsenhaComponent implements OnInit{
  count: number = 0;
  countNormal: number = 0;
  countPreferencial: number = 0;
  senhaPreferencial: number = 0;
  senhaNormal: number =0;
  senha: DadosSenha [] = [];
  senhaVerificar: DadosSenha[] =[];
  cadastrarSenha: DadosSenha = new DadosSenha;
  contadorSenha: DadosContador[] = [];
  operador: string ='';
  //VARIÁVEL QUE CRIA FORMULARIO
  formulario!: FormGroup;
 //VARIÁVEL DE BUSCA
  formularioBusca!: FormGroup;
  // ACESSAR TELA CONVENCIONAL
  convencional: boolean = false;

//SETORES 
  setoresDisponiveis: string[] = [];
  setorSelecionado: string = ''; // Setor escolhido
 
  constructor(
  private adminService: AdminService,
  private formBuilder: FormBuilder,
  private spinner: NgxSpinnerService,
  private db: Database, // Injeta o serviço do Firebase Realtime Database
  private router: Router,
  private authService: AuthService
  ){}

  // Método inicial executado ao carregar o componente
 async ngOnInit(){
  // Verifica se o usuário está autenticado ao carregar o componente
  if (!this.authService.isUserAuthenticated()) {
    this.router.navigate(['/login']);  // Redireciona para o login se não estiver autenticado
  } else {
    this.formbuilder();
    this.formBusca();
    this.convencional =true;
    await this.carregarSetores();
   await this.adminService.getContadorSenhaConvencional().subscribe( d => {
        
      console.log(d);
      console.log(d.length);
      this.senha = d;
      console.log(this.senha);

     
    })
}
  }

 // Método para inicializar o formulário de cadastro de senhas
  formbuilder(){
      
    this.formulario = this.formBuilder.group({
     
      nome: ['',[Validators.required, Validators.minLength(6)]],
      corretor:['',[Validators.required, Validators.minLength(8)]],
      
    })      
  }

  // Método para inicializar o formulário de busca de senhas
  formBusca() {
    this.formularioBusca = this.formBuilder.group({
      corretor:['',[Validators.required, Validators.minLength(8)]],
    })
  }
 
  // Carrega os setores do Firebase
  async carregarSetores() {
    const setoresRef = ref(this.db, `avelar/setor`);
    const snapshot = await get(setoresRef);

    if (snapshot.exists()) {
      const setoresData = snapshot.val() as Record<string, { setor: string }>;
      this.setoresDisponiveis = Object.values(setoresData).map((item) => item.setor);
      console.log('Setores carregados:', this.setoresDisponiveis);
    } else {
      console.log('Nenhum setor encontrado no banco de dados.');
    }
  }

  // Gera uma nova senha normal
  async novaSenhaNormal() {
    this.spinner.show();
    this.senhaNormal = 0;
    this.countNormal= 0;
    this.cadastrarSenha.operador = '';
    this.cadastrarSenha.guiche = '';
    // Verifica se o setor foi selecionado
  if (!this.setorSelecionado) {
    alert('Por favor, selecione um setor antes de gerar a senha.');
    this.spinner.hide();
    return;
  }

  // Atribui o setor selecionado à senha
  this.cadastrarSenha.setor = this.setorSelecionado;
  console.log('Setor selecionado para senha normal:', this.setorSelecionado); // Debug
    this.buscaQuantidadeSenhasGeradasConvencional('AN' , this.cadastrarSenha);


  }


// Gera uma nova senha preferencial  
async  novaSenhaPreferencial() {
  this.spinner.show();
  this.senhaPreferencial = 0;
  this.countPreferencial = 0;
  //this.cadastrarSenha.operador = 'PAULO';
 // this.cadastrarSenha.guiche = '02';
  this.cadastrarSenha.preferencial =true;

   // Verifica se o setor foi selecionado
   if (!this.setorSelecionado) {
    alert('Por favor, selecione um setor antes de gerar a senha.');
    this.spinner.hide();
    return;
  }

  // Atribui o setor selecionado à senha
  this.cadastrarSenha.setor = this.setorSelecionado;

  this.buscaQuantidadeSenhasGeradasConvencional('AP', this.cadastrarSenha);
}
  


   // Cadastra uma nova senha a partir do formulário
  async cadastrar(){
    this.spinner.show();
    this.count = 0
    console.log(this.formulario.value.corretor);
    this.cadastrarSenha.cliente = this.formulario.value.nome
    this.cadastrarSenha.operador = this.formulario.value.corretor;
    this.cadastrarSenha.guiche = this.formulario.value.corretor.slice(0,2);
    console.log(this.cadastrarSenha.guiche);

    this.cadastrarSenha.setor = this.setorSelecionado || 'ATENDIMENTO'; // Usa o setor selecionado ou "ATENDIMENTO"
    this.cadastrarSenha.senhaid = Date.now().toString();

     this.buscaQuantidadeSenhasGeradas(this.cadastrarSenha);
     //this.count++;
    
     this.formulario.reset()
  }

  
  // Verifica as senhas cadastradas para o operador informado
  verificar() {
    this.senhaVerificar = [];
    console.log(this.formularioBusca.value);
    this.operador = this.formularioBusca.value.corretor;
    
    
    // Filtra senhas associadas ao operador
    for (let index = 0; index < this.senha.length; index++) {
       
      if (this.senha[index].operador == this.formularioBusca.value.corretor){
         this.senhaVerificar.push(this.senha[index]);
      }
      //console.log(this.senhaNormal);
      //console.log(this.senhaPreferencial);
    }
     
     // Exibe alerta se não houver senhas cadastradas
    if (this.senhaVerificar.length ===0){
      alert('Não exite senha cadastrada para esse corretor');
     }
  }

  
  // Busca a quantidade de senhas geradas no modo convencional
  async buscaQuantidadeSenhasGeradasConvencional(idsenha: string, senha: DadosSenha) {
    this.count = 0;
    this.senhaNormal = 0;
    this.senhaPreferencial = 0;
  
    // Conta as senhas preferenciais e normais, filtrando pelo setor
    for (let index = 0; index < this.senha.length; index++) {
      if (this.senha[index].setor === this.setorSelecionado) { // Filtra pelo setor
        if (this.senha[index].preferencial === true) {
          this.senhaPreferencial++;
          console.log(this.senhaPreferencial);
        } else if (this.senha[index].preferencial === false) {
          this.senhaNormal++;
          console.log(this.senhaNormal);
        }
      }
    }
  
    console.log(this.senhaNormal);
    console.log(this.senhaPreferencial);
  
    // Configura e salva a senha dependendo do tipo
    if (idsenha === 'AP') {
      this.cadastrarSenha.senha = idsenha + this.senhaPreferencial.toString();
      this.cadastrarSenha.setor = this.setorSelecionado;
      this.cadastrarSenha.status = '0';
      this.cadastrarSenha.senhaid = Date.now().toString();
      console.log(this.cadastrarSenha.senha);
  
      await this.adminService.salvaSenhaContadorConvencional(this.cadastrarSenha);
      await this.adminService.salvaSenhaConvencionalRealime(this.cadastrarSenha).then(async () => {
        await this.adminService.imprimir(this.cadastrarSenha).subscribe(() => {
          this.spinner.hide();
        });
      }).catch((e) => {
        console.log(e);
      });
    }
  
    if (idsenha === 'AN') {
      this.cadastrarSenha.senha = idsenha + this.senhaNormal.toString();
      this.cadastrarSenha.setor = this.setorSelecionado;
      this.cadastrarSenha.status = '0';
      this.cadastrarSenha.senhaid = Date.now().toString();
      console.log(this.cadastrarSenha.senha);
  
      await this.adminService.salvaSenhaContadorConvencional(this.cadastrarSenha);
      await this.adminService.salvaSenhaConvencionalRealime(this.cadastrarSenha).then(async () => {
        await this.adminService.imprimir(this.cadastrarSenha).subscribe(() => {
          this.spinner.hide();
        });
      }).catch((e) => {
        console.log(e);
      });
    }
  
    this.cadastrarSenha.preferencial = false;
  }
  
// Busca a quantidade de senhas geradas para um operador específico 
async buscaQuantidadeSenhasGeradas(senha: DadosSenha) {
  this.count = 0;

  await this.adminService.getContadorSenha(senha.operador).then((d) => {
    this.count = d.length + 1;
  });

  this.cadastrarSenha.senha = 'TS' + this.count.toString();

  //await this.adminService.salvaSenhaRealTime(this.cadastrarSenha);
  await this.adminService.salvaSenhaEvento(this.cadastrarSenha).then(async () => {
    await this.adminService.imprimir(this.cadastrarSenha).subscribe(() => {
      this.spinner.hide();
    });
  });
}
}

