import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BsModalRef, BsModalService, } from 'ngx-bootstrap/modal'
import { Router } from '@angular/router';
import { get, getDatabase, ref, set, update } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { AuthService } from '../../service/auth/auth.service';


// Importar o Modal do Bootstrap
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


@Component({
  selector: 'app-chamar-paciente',
 standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule, FormsModule,],
  templateUrl: './chamar-paciente.component.html',
  styleUrl: './chamar-paciente.component.scss',
  providers:[BsModalRef, BsModalService]
})
export class ChamarPacienteComponent implements OnInit {
 operador: string ='';
   guiche: string = '';
   setor: string ='';
   senhaOperadorPainel: DadosSenha = new DadosSenha;
   
 
   
   senhaPainel: DadosSenha[] =[];
   repetirSenha: DadosSenha []= [];
   senhaFinalizar: DadosSenha = new DadosSenha;
   telaoperador:boolean = false;
   telalogin:boolean = true;
   mostrarSenhas: boolean = false; // Controla a exibição das senhas não atendidas
   mostrarFormularioPaciente: boolean = false;
   dadosPaciente = {
     nome: '',
     medico: '',
     consultorio: '',
     senhaid: ''
   };
   medicos: any[] = []; // Lista de médicos
   consultorios: any[] = []; // Lista de consultórios
   private keyPressHandler!: (event: KeyboardEvent) => void;

   
 
 
   
   nomeSelecionado: string = '';
   
 
 
 
   // Array para armazenar as senhas geradas
   senhasDisponiveis: DadosSenha[] = [];
 
   //VARIÁVEL QUE CRIA FORMULARIO
 
    formulario!: FormGroup;
 
    senha: DadosSenha [] = [];
    senhaVerificar: DadosSenha[] =[];
 
    modalRef?: BsModalRef;
    @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
   constructor(
     private adminService: AdminService,
     private formBuilder: FormBuilder,
     private spinner: NgxSpinnerService,
     private modalService: BsModalService,
     private router: Router,
     private db: Database,
      private authService: AuthService
   ) {}
 






 
   ngOnInit(): void {
     // Verifica se o usuário está autenticado ao carregar o componente
  {
     this.formbuilder()
     this.carregarMedicos();
     this.carregarConsultorios();
  }
 
 
 
  // Busca as senhas não atendidas ao carregar o componente
  this.mostrarSenhasNaoAtendidas();
 

  
     
     
      // Aqui unifica todas as senhas com status "0"
   this.adminService.getSenhaGeradaConvencional().subscribe(d => {
     this.repetirSenha = d;
     this.senhasDisponiveis = d.filter(s => s.status === '0');
   });
 
   // Painel
   this.adminService.getSenhaPainelConvencional().subscribe(d => {
     this.senhaPainel = d;
   });
 
  
 }
  
   // Método para carregar os médicos do nó "medicos"
   carregarMedicos() {
     const medicosRef = ref(this.db, 'medicos');
     get(medicosRef)
       .then((snapshot) => {
         if (snapshot.exists()) {
           this.medicos = Object.values(snapshot.val());
         }
       })
       .catch((error) => {
         console.error('Erro ao carregar médicos:', error);
       });
   }
 
   // Método para carregar os consultórios do nó "consultorios"
   carregarConsultorios() {
     const consultoriosRef = ref(this.db, 'consultorios');
     get(consultoriosRef)
       .then((snapshot) => {
         if (snapshot.exists()) {
           this.consultorios = Object.values(snapshot.val());
         }
       })
       .catch((error) => {
         console.error('Erro ao carregar consultórios:', error);
       });
   }
 
   ngOnDestroy() {
     document.removeEventListener('keydown', this.keyPressHandler);
   }
 
  
 
    
     
      
     
  
 
   // Criação do formulário de login do operador
   formbuilder(){
     this.formulario = this.formBuilder.group({
       setor: ['', Validators.required],
       guiche: ['',[Validators.required, Validators.minLength(5)]],
       nome: ['',[Validators.required, Validators.minLength(6)]],
     })      
   }
 
  
   
   
    // Repete a chamada de uma senha no painel
   async repetirsenha(senha: DadosSenha) {
  this.spinner.show();
  try {
    const time = Date.now().toString();
    const senhachamadaPath = `avelar/senhachamada/${senha.senhaid}`;
    await update(ref(this.db, senhachamadaPath), {
      status: '1',
      horachamada: time
    });
    console.log('Chamada repetida:', senha);
  } catch (error) {
    console.error('Erro ao repetir chamada:', error);
  } finally {
    this.spinner.hide();
  }
}
 
  // Repete a chamada de uma senha convencional  
  async repetirSenhaConvencional(senha: DadosSenha) {
   this.spinner.show();
   console.log("Repetindo senha:", senha);
 
   // Remove a senha chamada anteriormente do painel
   this.senhaPainel = this.senhaPainel.filter(s => s.senhaid !== senha.senhaid);
 
   try {
    
   } catch (error) {
     console.error("Erro ao repetir senha:", error);
   } finally {
     this.spinner.hide();
   }
 }
 
    // Chama uma senha normal no painel
   async chamarsenhanormal(senha:DadosSenha) {
     this.spinner.show();
     let time = Date.now().toString();
     console.log(senha);
     console.log(senha.operador);
     senha.status ='1';
     senha.horachamada = time;
     console.log(senha);
     await this.adminService.salvaSenhaChamada(senha)
     await this.adminService.updateSenha(senha.senhaid, senha).then( d=> {
        this.spinner.hide();
       //  this.filtrarSenhasPorSetor(); // Atualiza a lista após chamada
     })
      // Registra o momento da chamada da senha
   this.senhaOperadorPainel = senha;  // Armazena a senha chamada
   }
   
   // Método para buscar as senhas do setor sem chamar automaticamente
 buscarSenhasDoSetor(): Promise<DadosSenha[]> {
   return new Promise((resolve, reject) => {
       this.adminService.getSenhasGeradas().subscribe(
           (senhas) => {
               console.log('Senhas recebidas para chamada:', senhas);
               if (!senhas || senhas.length === 0) {
                   console.warn('Nenhuma senha disponível para chamada.');
                   resolve([]);
                   return;
               }
 
               // Elimina duplicatas baseado no campo 'senha'
               const senhasUnicas = Array.from(new Set(senhas.map((s) => s.senha)))
                   .map((senhaUnica) => senhas.find((s) => s.senha === senhaUnica)!);
 
              
           },
           (error) => {
               console.error('Erro ao buscar senhas para chamada:', error);
               reject(error);
           }
       );
   });
 }
 
 // Método que só chama a senha quando o botão for clicado
 chamarSenhaConvencional(senhaSelecionada?: DadosSenha, repeticao: boolean = false) {
   this.spinner.show();
   const time = Date.now().toString();
 
   const senha = senhaSelecionada || this.senhasDisponiveis.sort((a, b) => +a.horaGeracao - +b.horaGeracao)[0];
 
   if (!senha) {
     console.warn('Nenhuma senha disponível para chamada.');
     this.spinner.hide();
     return;
   }
  
    senha.consultorio = this.formulario.value.guiche;
   senha.operador = this.operador;
   senha.guiche = this.guiche;
   senha.status = '1'; // Status "chamada"
   senha.horachamada = time;
 
   this.senhaOperadorPainel = senha;
 
   // Salvar a senha no nó `senhachamada`
   const senhachamadaPath = `avelar/senhachamada/${senha.senhaid}`;
   const senhageradaPath = `avelar/senhagerada/${senha.senhaid}`;
  //  const novoIdPath = `avelar/senhachamada/1`; 
 
   update(ref(this.db), {
     [senhachamadaPath]: {
       senhaid: senha.senhaid,
       senha: senha.senha,
       guiche: senha.guiche,
       operador: senha.operador,
       horachamada: senha.horachamada,
       status: senha.status,
       setor: senha.setor,
       
      nome: senha.nome, // Adiciona o nome do paciente
      consultorio: senha.consultorio // Adiciona o número do consultório
     }
  
   })
     .then(() => {
       console.log(`Senha salva no nó senhachamada: ${senhachamadaPath}`);
        // console.log(`Novo nó criado com ID único: ${novoIdPath}`);
 
       // Remover a senha do nó `senhagerada`
       update(ref(this.db), {
         [senhageradaPath]: null
       })
         .then(() => {
           console.log(`Senha removida do nó senhagerada: ${senhageradaPath}`);
         })
         .catch((error) => {
           console.error('Erro ao remover a senha do nó senhagerada:', error);
         });
     })
     .catch((error) => {
       console.error('Erro ao salvar a senha no nó senhachamada:', error);
     })
     .finally(() => {
       this.spinner.hide();
     });
 }
 

 
 // Método para buscar senhas filtradas pelo médico selecionado
buscarSenhasFiltradasPorMedico() {
  const senhasRef = ref(this.db, 'avelar/senhachamada');
  get(senhasRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const todasSenhas = Object.values(snapshot.val()) as DadosSenha[];
        // Filtra as senhas pelo médico selecionado
        this.senhasDisponiveis = todasSenhas.filter(
          (senha) => senha.medico === this.formulario.value.nome && senha.nome
        );
      } else {
        this.senhasDisponiveis = [];
      }
    })
    .catch((error) => {
      console.error('Erro ao buscar senhas:', error);
    });
}
 
 
 
 
   
  // Atualiza o método de cadastro para buscar as senhas após selecionar o médico
cadastrarConvencional() {
  console.log(this.formulario.value);

  if (!this.formulario.value.guiche) {
    alert('Por favor, selecione um consultório!');
    return;
  }
  if (!this.formulario.value.nome) {
    alert('Por favor, selecione um médico!');
    return;
  }

  if (this.formulario.value) {
    this.operador = this.formulario.value.nome;
    this.guiche = this.formulario.value.guiche;
    this.telaoperador = true;

    // Busca as senhas filtradas pelo médico selecionado
    this.buscarSenhasFiltradasPorMedico();
  } else {
    alert('Você precisa informar o médico e o consultório.');
  }

     
       // Filtra as senhas do operador atual
   this.senhaVerificar = [];
 
     for (let index = 0; index < this.repetirSenha.length; index++) {
       
       if(this.repetirSenha[index].guiche === this.guiche) {
          this.senhaOperadorPainel = this.repetirSenha[index];
       }
       
     }
     
   
   
   }
 
  
   
   
 
   
  async finalizarConvencional(senha: DadosSenha) {
  const time = Date.now().toString();
  senha.finalatendimento = time;
  senha.status = '3'; // Status "finalizado"

  try {
    const senhafinalizadaPath = `avelar/senhafinalizada/${senha.senhaid}`;
    const senhachamadaPath = `avelar/senhachamada/${senha.senhaid}`;
    // const novoIdPath = `avelar/senhachamada/1`;
    // Mover a senha para o nó `senhafinalizada`
    await update(ref(this.db), {
      [senhafinalizadaPath]: {
        ...senha,
        finalatendimento: senha.finalatendimento,
      },
      [senhachamadaPath]: null, // Remove do nó `senhachamada`
      // [novoIdPath]: null,
    });

    console.log('Senha movida para o nó senhafinalizada:', senha);
    alert('Atendimento finalizado com sucesso!');
  } catch (error) {
    console.error('Erro ao finalizar a senha:', error);
    alert('Erro ao finalizar a senha. Tente novamente.');
  }
}
 
 
   // Navega para a página de avaliação
 /*avaliar() {
   this.router.navigate(['/avaliar']); 
 }*/
mostrarSenhasNaoAtendidas() {
  console.log("Atualizando lista de senhas não atendidas...");

  // Atualiza a lista de senhas a cada 0,5 segundos
  setInterval(() => {
    const senhasRef = ref(this.db, 'avelar/senhachamada');
    get(senhasRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const todasSenhas = Object.values(snapshot.val()) as DadosSenha[];
          // Filtra as senhas com base no médico e consultório selecionados
          this.senhasDisponiveis = todasSenhas.filter(
            (senha) =>
              senha.medico === this.formulario.value.nome &&
              
              senha.nome // Garante que o campo nome não esteja vazio
          );
          console.log("Senhas disponíveis atualizadas:", this.senhasDisponiveis);
        } else {
          this.senhasDisponiveis = [];
          console.warn("Nenhuma senha encontrada.");
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar senhas:", error);
      });
  }, 500); // Atualiza a cada 0,5 segundos
}
 
 
 
 
 
   
 
 
 
 
 }
 