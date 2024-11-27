import { Component, OnInit, TemplateRef } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BsModalRef, BsModalService, } from 'ngx-bootstrap/modal'
import { Router } from '@angular/router';
// Importar o Modal do Bootstrap
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@Component({
  selector: 'app-operador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule,],
  templateUrl: './operador.component.html',
  styleUrl: './operador.component.scss',
  providers:[BsModalRef, BsModalService]
})
export class OperadorComponent implements OnInit {
  operador: string ='';
  guiche: string = '';
  setor: string ='';
  senhaOperadorPainel: DadosSenha = new DadosSenha;
  senhaPreferencial: DadosSenha []= [];
  senhaNormal: DadosSenha = new DadosSenha;
  senhaNormalNova: DadosSenha[] = [];
  senhaPainel: DadosSenha[] =[];
  repetirSenha: DadosSenha []= [];
  senhaFinalizar: DadosSenha = new DadosSenha;
  telaoperador:boolean = false;
  telalogin:boolean = true;
  mostrarSenhas: boolean = false; // Controla a exibição das senhas não atendidas
  
  // Array para armazenar as senhas geradas
   
  
  //VARIÁVEL QUE CRIA FORMULARIO

   formulario!: FormGroup;

   senha: DadosSenha [] = [];
   senhaVerificar: DadosSenha[] =[];

   modalRef?: BsModalRef;

  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private modalService: BsModalService,
    private router: Router,
  ) {}


  ngOnInit(): void {
    this.formbuilder()
    
    // Obtém as senhas geradas do serviço AdminService
    this.adminService.getSenhasGeradas().subscribe(d => {
      console.log(d.length);
      this.senha = d;
     
       // Filtra senhas do operador atual
      this.senhaVerificar = this.senha.filter(s => s.operador === this.operador);
        
     
    });
   
    
     // Obtém senhas convencionais e organiza em preferencial e normal
    this.adminService.getSenhaGeradaConvencional().subscribe(d =>{
      console.log(d.length);
      this.repetirSenha = d;
      this.senhaNormalNova = [];
      this.senhaPreferencial = [];
        for (let index = 0; index < d.length; index++) {
        
          if (d[index].preferencial == true && d[index].status == '0'){
            this.senhaPreferencial.push(d[index]);
           
          }else if(d[index].status == '0') {
            this.senhaNormalNova.push(d[index]);
           
          }
        
        }
        console.log(this.senhaNormalNova);
        console.log(this.senhaPreferencial);
    })

    // Obtém senhas do painel convencional
    this.adminService.getSenhaPainelConvencional().subscribe(async d =>{
       this.senhaPainel = d
    })
  }

  
 

  // Criação do formulário de login do operador
  formbuilder(){
    this.formulario = this.formBuilder.group({
      guiche: ['',[Validators.required, Validators.minLength(5)]],
      nome: ['',[Validators.required, Validators.minLength(6)]],
    })      
  }

  
  // Função para gerar uma nova senha
  novasenha() {}
  
   // Repete a chamada de uma senha no painel
  async repetirsenha(senha:DadosSenha) {
    // console.log(senha);
    this.spinner.show();
     for (let index = 0; index < this.senhaPainel.length; index++) {
       if( senha.senhaid === this.senhaPainel[index].senhaid ){
         this.senhaPainel[index].status = '1'
       await  this.adminService.updateSenhaChamada(this.senhaPainel[index].horachamada, this.senhaPainel[index]).then(async d => {
           console.log(d);
           await delay(2000);
           this.spinner.hide();
         })
       } 
     }
      this.spinner.hide();
    
         
   }

 // Repete a chamada de uma senha convencional  
 async repetirSenhaConvencional(senha:DadosSenha) {
  this.spinner.show();  
   console.log(senha);
    let senhaRepetida: DadosSenha = senha; 
   
    for (let index = 0; index < this.senhaPainel.length; index++) {
      if( senha.senhaid === this.senhaPainel[index].senhaid ){
        this.senhaPainel[index].status = '1'
      await  this.adminService.deleteSenhaChamadaConvencional(this.senhaPainel[index].horachamada).then( async d => {
    
           if(senhaRepetida.preferencial) {
                  this.senhaPreferencial[0] = senhaRepetida;
                  this.chamarsenhapreferencial().then(async d => {
                    await delay(4000);
                    this.spinner.hide();
                  });    
            } else {
                  this.senhaNormalNova[0] = senhaRepetida;
                  this.chamarSenhaNormalConvencional().then(async d =>{
                    await delay(4000);
                    this.spinner.hide();
                  })
            }
    
      }); 
      
      } 
    }
     this.spinner.hide();
     console.log(senhaRepetida);
        
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
    })
  }
  
  // Chama uma senha normal convencional
  async chamarSenhaNormalConvencional() {
    this.spinner.show();
    let time = Date.now().toString();
    console.log(this.senhaNormalNova[0]);
    this.senhaNormalNova[0].operador = this.operador;
    this.senhaNormalNova[0].guiche = this.guiche;
    this.senhaNormalNova[0].status ='1';
    this.senhaNormalNova[0].horachamada = time;
    this.senhaOperadorPainel = this.senhaNormalNova[0];
    console.log(this.senhaOperadorPainel);
   await this.adminService.salvaSenhaConvencionalChamadaRealTime(this.senhaNormalNova[0]).then( async d => {
      console.log(d);
     await this.adminService.updateSenhaRealtimeConvencional(this.senhaNormalNova[0].senhaid, this.senhaNormalNova[0]).then(d =>{
        this.spinner.hide();
      })
    })
  }
 
  // Chama uma senha preferencial convencional
  async chamarsenhapreferencial() {
    this.spinner.show();
    let time = Date.now().toString();
    console.log(this.senhaPreferencial[0]);
    this.senhaPreferencial[0].operador = this.operador;
    this.senhaPreferencial[0].guiche = this.guiche;
    this.senhaPreferencial[0].status ='1';
    this.senhaPreferencial[0].horachamada = time;
    this.senhaOperadorPainel = this.senhaPreferencial[0];
    await this.adminService.salvaSenhaConvencionalChamadaRealTime(this.senhaPreferencial[0]).then(async d => {
      console.log(d);
     await this.adminService.updateSenhaRealtimeConvencional(this.senhaPreferencial[0].senhaid, this.senhaPreferencial[0]).then(d =>{
        this.spinner.hide();
      })
    })
  } 

  // Registra operador no sistema
  cadastrar(){
    console.log(this.formulario.value);
    if(this.formulario.value){
      this.operador = this.formulario.value.corretor;
      this.telaoperador = true;
      console.log(this.operador);
    } else {
      alert('você precisa informar nome e número do local de atendimento');
    }
    this.senhaVerificar = [];
 
  
    for (let index = 0; index < this.senha.length; index++) {
       
      if (this.senha[index].operador == this.formulario.value.corretor){
         this.senhaVerificar.push(this.senha[index]);
      }
      
    }

  }

  
  // Registra operador convencional no sistema
  cadastrarConvencional(){
    console.log(this.formulario.value);
    if(this.formulario.value){
      this.operador = this.formulario.value.nome;
      this.guiche = this.formulario.value.guiche;
      this.telaoperador = true;
      console.log(this.operador);
    } else {
      alert('você precisa informar nome e número do local de atendimento');
    }
    
    for (let index = 0; index < this.repetirSenha.length; index++) {
      
      if(this.repetirSenha[index].guiche === this.guiche) {
         this.senhaOperadorPainel = this.repetirSenha[index];
      }
      
    }
    
  
  
  }

  
  // Abre um modal para finalizar atendimento
  openModal(template:TemplateRef<any>, senha:DadosSenha){
    this.modalRef = this.modalService.show(template);
    this.senhaFinalizar = senha;
  }

  
  // Finaliza atendimento
  finalizar(){
    let time = Date.now().toString();
    this.senhaFinalizar.finalatendimento = time;
    this.senhaFinalizar.status = '3';
    this.adminService.deleteSenhaChamada(this.senhaFinalizar);
    this.modalRef?.hide();

  }

  
  // Finaliza atendimento convencional
  finalizarConvencional(){
    let time = Date.now().toString();
    this.senhaFinalizar.finalatendimento = time;
    this.senhaFinalizar.status = '3';
    this.senhaOperadorPainel = new DadosSenha;
    this.adminService.finalizarSenhaChamadaConvencional(this.senhaFinalizar);
    this.modalRef?.hide();

  }

  // Encerrar (Função ainda não implementada)
  encerrar(senha:DadosSenha){

    

  }
      
  // Navega para a página de avaliação
avaliar() {
  this.router.navigate(['/avaliar']); 
}
 // Método para mostrar senhas não atendidas
  mostrarSenhasNaoAtendidas() {
    // Filtra as senhas que não foram atendidas (status diferente de 'atendido')
    this.senha = this.senha.filter(s => s.status !== 'atendido');
    this.mostrarSenhas = true; // Exibe a lista de senhas não atendidas
  }

  // Método para marcar a senha como atendida e realizar a ação
  atenderSenha(senha: DadosSenha) {
    senha.status = 'atendido'; // Marca a senha como atendida

    // Atualiza o status da senha no Firestore
    this.adminService.atualizarStatusSenha(senha).then(() => {
      alert(`Senha ${senha.senha} atendida com sucesso!`);
      
      // Atualiza a lista de senhas para refletir a alteração
      this.mostrarSenhas = false;
      this.senha = this.senha.filter(s => s.senha !== senha.senha);
    }).catch(error => {
      console.error("Erro ao atualizar o status da senha", error);
    });
  }


}


